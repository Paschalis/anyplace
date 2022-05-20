package cy.ac.ucy.cs.anyplace.smas.data.models.helpers

import android.content.Context
import com.google.android.gms.maps.model.LatLng
import com.google.gson.Gson
import cy.ac.ucy.cs.anyplace.lib.android.cache.Cache
import cy.ac.ucy.cs.anyplace.smas.data.RepoSmas
import cy.ac.ucy.cs.anyplace.smas.data.models.ChatMsg

/**
 * Extra functionality on top of the [ChatMsg] data class.
 * TODO: rename to data the encapsualting class of all helpers
 */
class ChatMsgHelper(val ctx: Context,
                    val repo: RepoSmas,
                    val obj: ChatMsg) {

  override fun toString(): String = Gson().toJson(obj, ChatMsg::class.java)

  companion object {
    /** Get all messages */
    const val TP_GET_ALL=0
    /** Get messages from a particular timestamp onwards */
    const val TP_GET_FROM=3

    const val TP_SEND_TXT = 1
    const val TP_SEND_IMG= 2
    const val TP_SEND_LOCATION= 3
    const val TP_SEND_4= 4 // TODO:DZ was alert. now unused.

    const val STP_TXT = "txt"
    const val STP_IMG= "img"
    const val STP_LOCATION= "loc" // TODO Alert is better as a flag.
    const val STP_TP4= "tp4"

    fun parse(str: String): ChatMsg = Gson().fromJson(str, ChatMsg::class.java)

    fun isImage(tp: Int) = tp == TP_SEND_IMG
    fun isText(tp: Int) = tp == TP_SEND_TXT
    @Deprecated("alerts are sent differently")
    fun isAlert(tp: Int) = tp == TP_SEND_LOCATION

    fun content(obj: ChatMsg) : String {
      return when {
        isImage(obj.mtype) -> "<base64>"
        else -> obj.msg.toString()
      }
    }

  }

  private val cache by lazy { Cache(ctx) }

  val prettyType: String
    get() {
      return when (obj.mtype) {
        TP_SEND_TXT -> STP_TXT
        TP_SEND_IMG -> STP_IMG
        TP_SEND_LOCATION ->  STP_LOCATION
        TP_SEND_4 -> STP_TP4
        else -> "UnknownType"
      }
    }

  val prettyTypeCapitalize: String
    get() { return prettyType.replaceFirstChar(Char::uppercase) }

  fun isText() : Boolean = isText(obj.mtype)
  fun isAlert() : Boolean = isAlert(obj.mtype)
  fun isImage() : Boolean = isImage(obj.mtype)

  fun content() = Companion.content(obj)

  fun latLng() : LatLng {
    val lat = obj.x
    val lon = obj.y
    return LatLng(lat, lon)
  }

}