package example.composecounter

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReusableContent
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val PanelTextStyle = TextStyle(color = Color.Black, fontSize = 20.sp)
private val BodyTextStyle = TextStyle(color = Color.Black, fontSize = 16.sp)
private val TileShape = RoundedCornerShape(8.dp)

/** androidx.compose runtime / ui / foundation / foundation-layout: 1.12.1.
 * Kotlin Compose compiler plugin version follows the project's Kotlin version.
 * This source was checked against the release source; it was not built on a device here.
 */
@Composable
fun Counter() {
    val count = remember { mutableIntStateOf(0) }
    val n = count.intValue
    val even = n % 2 == 0
    val increment = remember(count) { { count.intValue += 1 } }

    Column(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        // The same Layout call site and shape remain inside this reusable group.
        ReusableContent(even) {
            val prefix = remember { if (even) "Even" else "Odd" }
            val decoration = if (even) {
                Modifier.background(Color(0xFFD8F3DC), TileShape)
            } else {
                Modifier.border(2.dp, Color(0xFF3B82F6), TileShape)
            }

            CounterTile(
                label = "$prefix $n",
                modifier = Modifier
                    .width(200.dp)
                    .height(80.dp)
                    .graphicsLayer {
                        alpha = if (even) 1f else 0.65f
                        scaleX = if (even) 1f else 0.9f
                        scaleY = scaleX
                        clip = true
                        shape = TileShape
                    }
                    .then(decoration)
                    .padding(if (even) 12.dp else 20.dp),
            )
        }

        // A separate, ordinary conditional composition demonstrates branch removal.
        if (even) {
            BasicText("Even branch", style = BodyTextStyle)
        } else {
            Column {
                BasicText("Odd branch", style = BodyTextStyle)
                BasicText("Extra line", style = BodyTextStyle)
            }
        }

        IncrementControl(onClick = increment)
    }
}

@Composable
private fun CounterTile(label: String, modifier: Modifier) {
    Layout(
        modifier = modifier,
        content = {
            BasicText(
                text = label,
                style = PanelTextStyle,
                maxLines = 1,
                softWrap = false,
            )
        },
        measurePolicy = CounterTileMeasurePolicy,
    )
}

private object CounterTileMeasurePolicy : MeasurePolicy {
    override fun MeasureScope.measure(
        measurables: List<Measurable>,
        constraints: Constraints,
    ): MeasureResult {
        // width and height modifiers guarantee bounded constraints for this example.
        check(constraints.hasBoundedWidth && constraints.hasBoundedHeight)
        val child = measurables.single().measure(
            constraints.copy(minWidth = 0, minHeight = 0),
        )
        return layout(constraints.maxWidth, constraints.maxHeight) {
            child.placeRelative(0, 0)
        }
    }
}

@Composable
private fun IncrementControl(onClick: () -> Unit) {
    val interactions = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
    Box(
        modifier = Modifier
            .width(200.dp)
            .height(48.dp)
            .background(Color(0xFFE5E7EB))
            .clickable(
                interactionSource = interactions,
                indication = null,
                onClick = onClick,
            )
            .padding(12.dp),
    ) {
        BasicText("+1", style = BodyTextStyle)
    }
}
